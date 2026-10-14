package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.TitleDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TitleDefinitionRepository extends JpaRepository<TitleDefinition, Integer> {
    List<TitleDefinition> findAllByOrderByIdDesc();
    Optional<TitleDefinition> findByIdentityIdAndSource(Integer identityId, String source);
}
